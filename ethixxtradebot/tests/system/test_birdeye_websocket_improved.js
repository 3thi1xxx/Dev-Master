#!/usr/bin/env node
/**
 * Improved Birdeye WebSocket Test - Better Data Extraction
 * Enhanced to handle real transaction data and extract meaningful insights
 */

import WebSocket from 'ws';

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || 'f31ad137262d4a57bbb85e0b35a75208';
const CHAIN = 'solana';

console.log('🐦 IMPROVED BIRDEYE WEBSOCKET TEST');
console.log('=' .repeat(50));
console.log(`📡 Chain: ${CHAIN}`);
console.log(`🔑 API Key: ${BIRDEYE_API_KEY.substring(0, 8)}...`);
console.log('');

// Enhanced token tracking
const tokenRegistry = new Map();
const transactionStats = {
  total: 0,
  buys: 0,
  sells: 0,
  totalVolume: 0,
  largeTrades: 0
};

// Test tokens with better tracking
const testTokens = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' }
];

// WebSocket URL with API key
const wsUrl = `wss://public-api.birdeye.so/socket/${CHAIN}?x-api-key=${BIRDEYE_API_KEY}`;

// Create WebSocket with proper headers
const ws = new WebSocket(wsUrl, 'echo-protocol', {
  headers: {
    'Origin': 'ws://public-api.birdeye.so',
    'Sec-WebSocket-Origin': 'ws://public-api.birdeye.so',
    'Sec-WebSocket-Protocol': 'echo-protocol'
  }
});

// Enhanced message handling
function handleMessage(data) {
  try {
    const message = JSON.parse(data.toString());
    
    // Enhanced message type detection
    const messageType = message.type || message.event || 'UNKNOWN';
    
    switch (messageType) {
      case 'NEW_PAIR':
      case 'NEW_PAIR_DATA':
        handleNewPair(message);
        break;
        
      case 'PRICE_DATA':
      case 'price_update':
        handlePriceData(message);
        break;
        
      case 'TXS_DATA':
      case 'transaction':
      case 'trade':
        handleTransactionData(message);
        break;
        
      case 'LARGE_TXS_DATA':
      case 'large_trade':
        handleLargeTrade(message);
        break;
        
      case 'auth_success':
        console.log('🔐 Authentication successful');
        break;
        
      case 'pong':
        console.log('🏓 Pong received');
        break;
        
      default:
        // Try to extract useful information from unknown messages
        extractUsefulData(message);
    }
  } catch (error) {
    console.log('📦 Raw message (unparseable):', data.toString().substring(0, 200));
  }
}

function handleNewPair(message) {
  const data = message.data || message;
  console.log('🆕 NEW PAIR DETECTED!');
  console.log(`  Symbol: ${data.symbol || data.name || 'Unknown'}`);
  console.log(`  Address: ${data.address || 'Unknown'}`);
  console.log(`  Source: ${data.source || 'Unknown'}`);
  console.log(`  Base: ${data.base?.name || 'Unknown'}`);
  console.log(`  Liquidity: $${formatNumber(data.liquidity || 0)}`);
  console.log('');
}

function handlePriceData(message) {
  const data = message.data || message;
  const symbol = data.symbol || 'Unknown';
  const price = data.c || data.close || data.price || 0;
  const volume = data.v || data.volume || 0;
  const time = data.unixTime ? new Date(data.unixTime * 1000) : new Date();
  
  console.log(`📈 Price Update: ${symbol}`);
  console.log(`  Price: $${formatNumber(price, 6)}`);
  console.log(`  Volume: $${formatNumber(volume)}`);
  console.log(`  Time: ${time.toLocaleTimeString()}`);
  console.log('');
}

function handleTransactionData(message) {
  const data = message.data || message;
  transactionStats.total++;
  
  // Enhanced transaction parsing
  const side = data.side || data.type || 'unknown';
  const amount = parseFloat(data.amount || data.value || data.volume || 0);
  const owner = data.owner || data.trader || data.wallet || 'Unknown';
  const symbol = data.symbol || 'Unknown';
  const price = data.price || 0;
  
  // Update stats
  if (side.toLowerCase() === 'buy') {
    transactionStats.buys++;
  } else if (side.toLowerCase() === 'sell') {
    transactionStats.sells++;
  }
  
  if (amount > 0) {
    transactionStats.totalVolume += amount;
  }
  
  // Only show meaningful transactions
  if (amount > 0) {
    console.log(`💸 Transaction: ${symbol}`);
    console.log(`  Type: ${side.toUpperCase()}`);
    console.log(`  Amount: $${formatNumber(amount)}`);
    console.log(`  Price: $${formatNumber(price, 6)}`);
    console.log(`  Trader: ${owner.substring(0, 8)}...`);
    console.log('');
  }
}

function handleLargeTrade(message) {
  const data = message.data || message;
  transactionStats.largeTrades++;
  
  const amount = parseFloat(data.amount || data.value || data.volume || 0);
  const side = data.side || data.type || 'unknown';
  const symbol = data.symbol || 'Unknown';
  const owner = data.owner || data.trader || 'Unknown';
  
  console.log('🐋 LARGE TRADE DETECTED!');
  console.log(`  Token: ${symbol}`);
  console.log(`  Amount: $${formatNumber(amount)}`);
  console.log(`  Type: ${side.toUpperCase()}`);
  console.log(`  Trader: ${owner.substring(0, 8)}...`);
  console.log('');
}

function extractUsefulData(message) {
  // Try to extract any useful information from unknown message types
  const data = message.data || message;
  
  // Look for common fields
  const usefulFields = {};
  
  if (data.symbol || data.name) usefulFields.symbol = data.symbol || data.name;
  if (data.address) usefulFields.address = data.address;
  if (data.price || data.value) usefulFields.price = data.price || data.value;
  if (data.volume || data.amount) usefulFields.volume = data.volume || data.amount;
  if (data.side || data.type) usefulFields.side = data.side || data.type;
  if (data.owner || data.trader) usefulFields.trader = data.owner || data.trader;
  
  if (Object.keys(usefulFields).length > 0) {
    console.log(`📦 Unknown message type: ${message.type}`);
    console.log(`  Extracted data:`, usefulFields);
    console.log('');
  } else {
    console.log(`📦 Received: ${message.type}`);
    console.log(`  Data:`, JSON.stringify(data, null, 2).substring(0, 200));
    console.log('');
  }
}

function formatNumber(num, decimals = 2) {
  if (num === 0) return '0';
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(decimals);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
}

function printStats() {
  console.log('\n📊 TRANSACTION STATISTICS');
  console.log('=' .repeat(30));
  console.log(`Total Transactions: ${transactionStats.total}`);
  console.log(`Buys: ${transactionStats.buys} (${((transactionStats.buys/transactionStats.total)*100).toFixed(1)}%)`);
  console.log(`Sells: ${transactionStats.sells} (${((transactionStats.sells/transactionStats.total)*100).toFixed(1)}%)`);
  console.log(`Total Volume: $${formatNumber(transactionStats.totalVolume)}`);
  console.log(`Large Trades: ${transactionStats.largeTrades}`);
  console.log(`Average Trade: $${formatNumber(transactionStats.totalVolume / transactionStats.total)}`);
  console.log('');
}

// Ping interval for connection stability
let pingInterval;
const PING_INTERVAL = 30000; // 30 seconds

ws.on('open', () => {
  console.log('✅ Connected to Birdeye WebSocket!');
  console.log('');
  
  // Start ping interval
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('🏓 Sending ping...');
      ws.ping();
    }
  }, PING_INTERVAL);
  
  // Subscribe to NEW_PAIR events (new token listings)
  console.log('📡 Subscribing to NEW_PAIR events...');
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_NEW_PAIR'
  }));
  
  // Subscribe to price updates for test tokens
  testTokens.forEach(token => {
    console.log(`📊 Subscribing to price updates for ${token.symbol}...`);
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_PRICE',
      data: {
        chartType: '1m',  // 1 minute candles
        currency: 'token',
        address: token.address
      }
    }));
    
    // Also subscribe to transactions
    console.log(`💸 Subscribing to transactions for ${token.symbol}...`);
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_TXS',
      data: {
        currency: 'token',
        address: token.address
      }
    }));
  });
  
  // Subscribe to large trades (>$10k)
  console.log('🐋 Subscribing to large trades (>$10k)...');
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_LARGE_TRADE_TXS',
    data: {
      min_volume: 10000  // $10k USD (FIXED: per Birdeye docs)
    }
  }));
  
  console.log('\n🎯 Listening for events...\n');
});

ws.on('message', handleMessage);

ws.on('pong', () => {
  console.log('🏓 Received pong');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed: ${code} - ${reason}`);
  if (pingInterval) clearInterval(pingInterval);
  printStats();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  
  // Unsubscribe from all events
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_NEW_PAIR' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_PRICE' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_TXS' }));
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE_LARGE_TRADE_TXS' }));
  
  ws.close();
  if (pingInterval) clearInterval(pingInterval);
  printStats();
  process.exit(0);
});

// Print stats every 30 seconds
setInterval(printStats, 30000);

console.log('Press Ctrl+C to stop\n'); 